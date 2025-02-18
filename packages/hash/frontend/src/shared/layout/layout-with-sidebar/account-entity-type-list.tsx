import { useState, useMemo, useRef, VFC, useEffect, Ref } from "react";
import {
  Box,
  Tooltip,
  outlinedInputClasses,
  Fade,
  Collapse,
} from "@mui/material";
import { TransitionGroup } from "react-transition-group";
import { faArrowUpAZ, faSearch } from "@fortawesome/free-solid-svg-icons";
import { orderBy } from "lodash";
import { useRouter } from "next/router";
import { usePopupState, bindTrigger } from "material-ui-popup-state/hooks";
import {
  IconButton,
  TextField,
  FontAwesomeIcon,
} from "@hashintel/hash-design-system";
import { useAccountEntityTypes } from "../../../components/hooks/useAccountEntityTypes";
import { NavLink } from "./nav-link";

import { EntityTypeItem } from "./account-entity-type-list/entity-type-item";
import {
  SortActionsDropdown,
  SortType,
} from "./account-entity-type-list/sort-actions-dropdown";

type SearchInputProps = {
  searchVisible: boolean;
  searchInputRef: Ref<HTMLInputElement>;
  showSearchInput: () => void;
  hideSearchInput: () => void;
  onChangeText: (text: string) => void;
};

const SearchInput: VFC<SearchInputProps> = ({
  searchVisible,
  searchInputRef,
  showSearchInput,
  // hideSearchInput,
  onChangeText,
}) => (
  <>
    <Tooltip title="Search for types">
      <IconButton
        size="medium"
        sx={({ palette }) => ({ color: palette.gray[50] })}
        onClick={() => showSearchInput()}
      >
        {/* @todo-mui get a free icon that matches the design closely */}
        <FontAwesomeIcon icon={faSearch} />
      </IconButton>
    </Tooltip>
    <Fade in={searchVisible}>
      <TextField
        variant="outlined"
        size="small"
        placeholder="Search for types"
        inputRef={searchInputRef}
        onChange={(evt) => onChangeText(evt.target.value)}
        sx={({ palette }) => ({
          position: "absolute",
          right: 0,
          width: "204px",
          height: "100%",
          borderRadius: "4px",
          backgroundColor: palette.white,
          [`.${outlinedInputClasses.notchedOutline}`]: {
            borderRadius: "4px",
          },
          [`.${outlinedInputClasses.focused} .${outlinedInputClasses.notchedOutline}`]:
            {
              borderColor: palette.blue[60],
            },
        })}
        InputProps={{
          sx: ({ typography, palette }) => ({
            ...typography.smallTextLabels,
            color: palette.gray[80],
            fontWeight: 500,
            pl: 1.5,
            pr: 1,
            boxShadow: "none",
            [`& .${outlinedInputClasses.input}`]: {
              px: 0,
              py: 0.875,
              "&::placeholder": {
                color: palette.gray[50],
                opacity: 1,
              },
            },
          }),

          // Commented this out because "View All Types" is commented out
          // Ideally the textfield is meant to appear on top of "View All Types"
          // when the search icon is clicked, and should close when
          // close search icon is clicked.
          // Since "View All Types" isn't displayed at the moment, this
          // text field will always be visible and as a result there is no need
          // to show the close search icon.
          // @todo uncomment when "View All Types" has been implemented
          // endAdornment: (
          //   <Tooltip title="Clear Search">
          //     <IconButton onClick={hideSearchInput} size="small" unpadded>
          //       <FontAwesomeIcon icon={faXmark} />
          //     </IconButton>
          //   </Tooltip>
          // ),
        }}
      />
    </Fade>
  </>
);

type AccountEntityTypeListProps = {
  accountId: string;
};

export const AccountEntityTypeList: VFC<AccountEntityTypeListProps> = ({
  accountId,
}) => {
  const { data } = useAccountEntityTypes(accountId);
  const router = useRouter();

  const [sortType, setSortType] = useState<SortType>("asc");
  const [searchVisible, setSearchVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortActionsPopupState = usePopupState({
    variant: "popover",
    popupId: "type-sort-actions-menu",
  });

  useEffect(() => {
    if (searchVisible) {
      searchInputRef.current?.focus();
    }
  }, [searchVisible]);

  // todo: handle search server side
  const filteredData = useMemo(() => {
    let entityTypes = data?.getAccountEntityTypes ?? [];

    if (searchQuery) {
      entityTypes = entityTypes.filter(({ properties }) =>
        properties.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Right now we just handle ascending/descending and default to ascending
    // for other sort types
    return orderBy(
      entityTypes,
      ["properties.title"],
      [sortType === "asc" || sortType === "desc" ? sortType : "asc"],
    );
  }, [sortType, data, searchQuery]);

  return (
    <Box>
      <NavLink
        title="Types"
        endAdornmentProps={{
          tooltipTitle: "Create new type",
          href: `/${accountId}/types/new`,
          "data-testid": "create-entity-btn",
        }}
      >
        <Box component="ul">
          <Box
            tabIndex={0}
            component="li"
            sx={({ palette }) => ({
              display: "flex",
              alignItems: "center",
              mx: 0.5,
              minHeight: 36,
              my: 0.25,
              borderRadius: "4px",
              // "&:hover": {
              //   backgroundColor: palette.gray[20],
              // },
              "&:focus-visible": {
                backgroundColor: "red",
              },
              ...(sortActionsPopupState.isOpen && {
                backgroundColor: palette.gray[20],
              }),
            })}
          >
            <Box
              display="flex"
              alignItems="center"
              flex={1}
              mr={0.25}
              pl={3.5}
              position="relative"
            >
              {/*
                Commented this out because the functionality is not present yet 
                ("View All Pages" screen hasn't been designed/built)

                @todo uncomment when this has been done
              */}

              {/* <Link
                href="/"
                noLinkStyle
                tabIndex={-1}
                sx={{
                  mr: "auto",
                  flex: 1,
                }}
              >
                <Typography
                  variant="smallTextLabels"
                  sx={({ palette }) => ({
                    fontWeight: 600,
                    color: palette.gray[80],
                  })}
                >
                  View All Types
                </Typography>
              </Link> */}

              <SearchInput
                searchVisible={searchVisible}
                searchInputRef={searchInputRef}
                showSearchInput={() => setSearchVisible(true)}
                hideSearchInput={() => setSearchVisible(false)}
                onChangeText={(query) => setSearchQuery(query)}
              />
            </Box>
            <Tooltip title="Sort types">
              <IconButton
                {...bindTrigger(sortActionsPopupState)}
                sx={({ palette }) => ({
                  color: palette.gray[50],
                  ...(sortActionsPopupState.isOpen && {
                    backgroundColor: palette.gray[30],
                    color: palette.gray[80],
                  }),
                })}
              >
                {/* @todo-mui get a free icon that matches the design closely */}
                <FontAwesomeIcon icon={faArrowUpAZ} />
              </IconButton>
            </Tooltip>
            <SortActionsDropdown
              popupState={sortActionsPopupState}
              setSortType={setSortType}
              activeSortType={sortType}
            />
          </Box>
          <TransitionGroup>
            {filteredData.map((entityType) => {
              return (
                <Collapse key={entityType.entityId}>
                  <EntityTypeItem
                    title={entityType.properties.title}
                    entityId={entityType.entityId}
                    accountId={accountId}
                    /**
                     * @todo Pulling the entityId from the url will break once we switch to using slugs to represent entity types
                     * We need to create a context to pull the right entityId in that scenario
                     */
                    selected={router.query.typeId === entityType.entityId}
                  />
                </Collapse>
              );
            })}
          </TransitionGroup>
        </Box>
      </NavLink>
    </Box>
  );
};
